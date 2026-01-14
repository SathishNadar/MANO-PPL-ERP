import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 7,
        color: '#000000',
    },
    borderBox: {
        border: '1pt solid #000000',
        marginBottom: 0,
    },
    headerRow: {
        flexDirection: 'row',
        height: 60,
        borderBottom: '1pt solid #000000',
    },
    logoSection: {
        width: '20%',
        borderRight: '1pt solid #000000',
        padding: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 120,
        height: 40,
        objectFit: 'contain',
    },
    titleSection: {
        width: '60%',
        borderRight: '1pt solid #000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleText: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
    },
    infoSection: {
        width: '20%',
        justifyContent: 'center',
        paddingLeft: 10,
    },
    projectInfoRow: {
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
        minHeight: 20,
    },
    infoLabel: {
        fontFamily: 'Helvetica-Bold',
        padding: 4,
    },
    infoValue: {
        flex: 1,
        padding: 4,
    },
    table: {
        flexDirection: 'column',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderBottom: '1pt solid #000000',
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
        minHeight: 25,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
        minHeight: 25,
    },
    // Column Widths optimized for Project Directory
    colSno: { width: '3%', borderRight: '1pt solid #000000', justifyContent: 'center', alignItems: 'center' },
    colCompany: { width: '13%', borderRight: '1pt solid #000000', padding: 3, justifyContent: 'center' },
    colNature: { width: '10%', borderRight: '1pt solid #000000', padding: 3, justifyContent: 'center' },
    colPerson: { width: '10%', borderRight: '1pt solid #000000', padding: 3, justifyContent: 'center' },
    colDesignation: { width: '9%', borderRight: '1pt solid #000000', padding: 3, justifyContent: 'center' },
    colResp: { width: '14%', borderRight: '1pt solid #000000', padding: 3, justifyContent: 'center' },
    colMob: { width: '11%', borderRight: '1pt solid #000000', padding: 3, justifyContent: 'center' },
    colEmail: { width: '15%', borderRight: '1pt solid #000000', padding: 3, justifyContent: 'center' },
    colAddress: { width: '15%', padding: 3, justifyContent: 'center' },

    footer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
        fontSize: 8,
    },
});

const formatLongData = (data) => {
    if (!data) return "-";
    return String(data).replace(/[\/,]/g, (match) => `${match} `);
};

const ProjectDirectoryPDF = ({ contacts, project }) => {
    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.borderBox}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View style={styles.logoSection}>
                            <Image src="/Mano-Logo.png" style={styles.logo} />
                        </View>
                        <View style={styles.titleSection}>
                            <Text style={styles.titleText}>Project Directory</Text>
                        </View>
                        <View style={styles.infoSection}>
                            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Date: {new Date().toLocaleDateString("en-GB")}</Text>
                        </View>
                    </View>

                    {/* Project Info */}
                    <View style={styles.projectInfoRow}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', borderRight: '1pt solid #000000' }}>
                            <Text style={styles.infoLabel}>Project:</Text>
                            <Text style={styles.infoValue}>{project?.project_name || "-"}</Text>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.infoLabel}>Client:</Text>
                            <Text style={styles.infoValue}>{project?.Employer || "-"}</Text>
                        </View>
                    </View>

                    {/* Table */}
                    <View style={styles.table}>
                        {/* Table Header */}
                        <View style={styles.tableHeaderRow}>
                            <View style={styles.colSno}><Text>S. No.</Text></View>
                            <View style={styles.colCompany}><Text>Company Name</Text></View>
                            <View style={styles.colNature}><Text>Nature of Job</Text></View>
                            <View style={styles.colPerson}><Text>Name of Person</Text></View>
                            <View style={styles.colDesignation}><Text>Designation</Text></View>
                            <View style={styles.colResp}><Text>Responsibilities</Text></View>
                            <View style={styles.colMob}><Text>Mobile No</Text></View>
                            <View style={styles.colEmail}><Text>Email ID</Text></View>
                            <View style={styles.colAddress}><Text>Address</Text></View>
                        </View>

                        {/* Table Rows */}
                        {contacts.map((contact, index) => (
                            <View key={contact.pd_id || index} style={[styles.tableRow, index === contacts.length - 1 ? { borderBottom: 0 } : {}]}>
                                <View style={styles.colSno}><Text>{index + 1}</Text></View>
                                <View style={styles.colCompany}><Text>{contact.company_name || "-"}</Text></View>
                                <View style={styles.colNature}><Text>{contact.job_nature || "-"}</Text></View>
                                <View style={styles.colPerson}><Text>{contact.contact_person || "-"}</Text></View>
                                <View style={styles.colDesignation}><Text>{contact.designation || "-"}</Text></View>
                                <View style={styles.colResp}><Text>{formatLongData(contact.responsibilities)}</Text></View>
                                <View style={styles.colMob}><Text>{formatLongData(contact.mobile_no)}</Text></View>
                                <View style={styles.colEmail}><Text>{formatLongData(contact.email)}</Text></View>
                                <View style={styles.colAddress}><Text>{formatLongData(contact.address_line)}</Text></View>
                            </View>
                        ))}
                    </View>
                </View>

                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Page ${pageNumber} of ${totalPages}`
                )} fixed />
            </Page>
        </Document>
    );
};

export default ProjectDirectoryPDF;
